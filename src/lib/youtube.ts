import axios from "axios";
import { YoutubeTranscript } from "youtube-transcript";
import { strict_output } from "./gpt";

export async function searchYoutube(searchQuery: string) {
  searchQuery = encodeURIComponent(searchQuery); // encode search searchQuery : hello world => hello+world
  const { data } = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5`
  );
  if (!data) {
    console.log("youtube fail");
    return null;
  }
  if (data.items[0] == undefined) {
    console.log("youtube fail");
    return null;
  }
  return data.items[0].id.videoId;
}

export async function getTranscript(videoId: string) {
  try {
    let transcript_arr = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
      // country: "EN",
    });
    let transcript = "";
    for (let t of transcript_arr) {
      transcript += t.text + " ";
    }

    return transcript.replaceAll("\n", "");
  } catch (error) {
    // return "";
    return "Error is " + error;
  }
}

export async function getQuestionsFromTranscript(
  transcript: string,
  course_title: string,
  searchQuery: string
) {
  type Question = {
    question: string;
    answer: string;
    option1: string;
    option2: string;
    option3: string;
  };
  const questions: Question[] = await strict_output(
    "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words. And do not include special characters, back slashes, and do not highlight any text using double quotation marks symbol and proper json format is required strictly.",
    new Array(5).fill(
      `You are to generate a random hard mcq question about ${course_title} related to ${searchQuery} with context of the following transcript: ${transcript}`
    ),
    {
      question: "question",
      answer: "answer with max length of 15 words",
      option1: "option1 with max length of 15 words",
      option2: "option2 with max length of 15 words",
      option3: "option3 with max length of 15 words",
    }
  );
  return questions;
}
