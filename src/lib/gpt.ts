// Inspired from https://github.com/tanchongmin/strictjson
// wraps gpt api to give API our ideal shape of json to produce correct json by feeding errors and asking it to generate again and again.
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface OutputFormat {
  [key: string]: string | OutputFormat | OutputFormat[];
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  // model: string = "gpt-3.5-turbo",
  model: string = "gpt-4o-mini",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  // if the user input is in a list, we also process the output as a list of json
  const list_input: boolean = Array.isArray(user_prompt);
  // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  // start off with no error message
  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output ${
      // list_output && "an array of objects in"
      list_output ? "an array of objects in" : ""
    } the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    // if output_format contains dynamic elements, process it accordingly
    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    // if input is in a list format, ask it to generate json in a list
    if (list_input) {
      output_format_prompt += `\nGenerate an array of json, one json for each input element.`;
    }

    // Use OpenAI to get a response
    const response = await openai.createChatCompletion({
      temperature: temperature,
      model: model,
      messages: [
        {
          role: "system",
          content: system_prompt + output_format_prompt + error_msg,
        },
        { role: "user", content: user_prompt.toString() },
      ],
    });

    let res: string =
      response.data.choices[0].message?.content?.replace(/'/g, '"') ?? "";

    // ensure that we don't replace away apostrophes in text
    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    // escape double quotes inside strings to ensure valid JSON
    res = res.replace(/\\([\s\S])|(")/g, "\\$1$2");

    // Ensure all double quotes within the JSON string are properly escaped
    res = res.replace(/(?<!\\)"/g, '\\"');

    // Remove any invalid escape sequences and other invalid characters
    res = res.replace(/\\(["'\\/bfnrt])/g, "\\$1"); // escape valid sequences like double quotes, single quotes, backslashes, and control characters
    res = res.replace(/\\u([\dA-Fa-f]{4})/g, "\\u$1"); // escape unicode sequences

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    // try-catch block to ensure output format is adhered to
    try {
      // Remove backslashes before parsing
      let cleanedRes = res.replace(/\\\"/g, '"');
      // let output: any = JSON.parse(res);
      let output: any = JSON.parse(cleanedRes);

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of json");
        }
      } else {
        output = [output];
      }

      // check for each element in the output_list, the format is correctly adhered to
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          // unable to ensure accuracy of dynamic output header, so skip it
          if (/<.*?>/.test(key)) {
            continue;
          }

          // if output field missing, raise an error
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          // check that one of the choices given for the list of words is an unknown
          if (Array.isArray(output_format[key])) {
            //   const choices = output_format[key] as string[];
            //   // ensure output is not a list
            //   // if (Array.isArray(output[index][key])) {
            //   //   output[index][key] = output[index][key][0];
            //   // }
            //   if (typeof output[index][key] !== "string") {
            //     throw new Error(`${key} is not a string`);
            //   }
            //   // output the default category (if any) if GPT is unable to identify the category
            //   if (!choices.includes(output[index][key]) && default_category) {
            //     output[index][key] = default_category;
            //   }
            //   // if the output is a description format, get only the label
            //   // if (output[index][key].includes(":")) {
            //   if (
            //     typeof output[index][key] === "string" &&
            //     output[index][key].includes(":")
            //   ) {
            //     output[index][key] = output[index][key].split(":")[0];
            //   }
            // } else if (
            //   typeof output_format[key] === "object" &&
            //   !Array.isArray(output_format[key])
            // ) {
            if (!Array.isArray(output[index][key])) {
              throw new Error(`${key} is not an array`);
            }

            const nestedOutputFormat = output_format[key][0] as OutputFormat;

            for (
              let nestedIndex = 0;
              nestedIndex < output[index][key].length;
              nestedIndex++
            ) {
              for (const nestedKey in nestedOutputFormat) {
                if (!(nestedKey in output[index][key][nestedIndex])) {
                  throw new Error(`${nestedKey} not in nested json output`);
                }
              }
            }
          } else if (typeof output_format[key] === "object") {
            if (
              typeof output[index][key] !== "object" ||
              Array.isArray(output[index][key])
            ) {
              throw new Error(`${key} is not an object`);
            }

            const nestedOutputFormat = output_format[key] as OutputFormat;

            for (const nestedKey in nestedOutputFormat) {
              if (!(nestedKey in output[index][key])) {
                throw new Error(`${nestedKey} not in nested json output`);
              }
            }
          } else if (typeof output[index][key] !== "string") {
            throw new Error(`${key} is not a string`);
          }
        }

        // if we just want the values for the outputs
        if (output_value_only) {
          output[index] = Object.values(output[index]);
          // just output without the list if there is only one element
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      // Type-cast `e` to `Error` to access the `message` property

      const error = e as Error;

      // Add specific error handling for JSON parsing issues

      if (error instanceof SyntaxError) {
        error_msg = `\n\nInvalid JSON format received. Error message: ${error.message}\nGPT response: ${res}`;
      } else {
        error_msg = `\n\nError message: ${error.message}\nGPT response: ${res}`;
      }

      console.log("An exception occurred:", error);

      console.log("Current invalid json format ", res);
    }
    // catch (e) {
    //   error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
    //   console.log("An exception occurred:", e);
    //   console.log("Current invalid json format ", res);
    // }
  }

  return [];
}
