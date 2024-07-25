// /api/chapter/getInfo

import { prisma } from "@/lib/db";
import { strict_output } from "@/lib/gpt";
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYoutube,
} from "@/lib/youtube";
import { error } from "console";
import { NextResponse } from "next/server";
import { z } from "zod";

// const sleep = async () =>
//   new Promise((resolve) => {
//     setTimeout(resolve, Math.random() * 4000);
//   }); //for testing purpose

const bodyParser = z.object({
  chapterId: z.string(),
});

export async function POST(req: Request, res: Response) {
  try {
    // await sleep();
    // return NextResponse.json({ message: "hello" }); //for testing purpose
    const body = await req.json();
    const { chapterId } = bodyParser.parse(body);
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
    });
    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: "Chapter not found",
        },
        { status: 404 }
      );
    }
    const videoId = await searchYoutube(chapter.youtubeSearchQuery); //search from YouTube
    let transcript = await getTranscript(videoId); // to get transcript from YouTube
    let maxLength = 500;
    transcript = transcript.split(" ").slice(0, maxLength).join(" "); //limit transcript to 500 words

    const { summary }: { summary: string } = await strict_output(
      "You are an AI capable of summarising  a youtube transcript",
      "summarise in 250 words or less and do not talk about the sponsors or anything unrelated to the main topic, also do not introduce what the summary is about. And do not include special characters, back slashes, and do not highlight any text using double quotation marks symbol and proper json format is required strictly.\n" +
        transcript,
      { summary: "summary of the transcript" }
    );

    const questions = await getQuestionsFromTranscript(
      transcript,
      chapter.name,
      chapter.youtubeSearchQuery
    );

    await prisma.question.createMany({
      //creating question in db
      data: questions.map((question) => {
        let options = [
          question.answer,
          question.option1,
          question.option2,
          question.option3,
        ];
        options = options.sort(() => Math.random() - 0.5);
        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          chapterId: chapterId,
        };
      }),
    });

    await prisma.chapter.update({
      // update videoid and summary in db
      where: { id: chapterId },
      data: {
        videoID: videoId,
        summary: summary,
      },
    });

    // return NextResponse.json({ videoId, transcript, summary });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid body",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          // error: "unknown",
          error: error,
        },
        { status: 500 }
      );
    }
  }
}
