"use client";
import { cn } from "@/lib/utils";
import { Chapter } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { error } from "console";
import React, { use } from "react";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

type Props = {
  chapter: Chapter;
  chapterIndex: number;
  completedChapters: Set<String>; //getting from ConfirmChapters
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<String>>>; //getting from ConfirmChapters
};

export type ChapterCardHandler = {
  triggerLoad: () => void;
};

const ChapterCard = React.forwardRef<ChapterCardHandler, Props>(
  ({ chapter, chapterIndex, setCompletedChapters, completedChapters }, ref) => {
    const { toast } = useToast(); //for toast messages
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const { mutate: getChapterInfo, isPending } = useMutation({
      mutationFn: async () => {
        const response = await axios.post("/api/chapter/getInfo", {
          chapterId: chapter.id,
        });
        return response.data;
      },
    });

    const addChapterIdToSet = React.useCallback(() => {
      // to add current chaper id to completedChapters

      // const newSet = new Set(completedChapters);
      // newSet.add(chapter.id);
      // setCompletedChapters(newSet);

      setCompletedChapters((prev) => {
        const newSet = new Set(prev);
        newSet.add(chapter.id);
        return newSet;
      });
    }, [
      // completedChapters,
      chapter.id,
      setCompletedChapters,
    ]);

    React.useEffect(() => {
      //mark completedChapters to Green directly by checking in db
      if (chapter.videoID) {
        setSuccess(true);
        addChapterIdToSet;
      }
    }, [chapter, addChapterIdToSet]);

    React.useImperativeHandle(ref, () => ({
      async triggerLoad() {
        // console.log("hello"); //for tesing
        if (chapter.videoID) {
          //do not reprocess completedChapters
          addChapterIdToSet();
          return;
        }
        getChapterInfo(undefined, {
          onSuccess: () => {
            // console.log("success");
            setSuccess(true); //changing color to Green
            addChapterIdToSet();
          },
          onError: (error) => {
            console.error(error);
            setSuccess(false); //changing color to Red
            toast({
              title: "Error",
              description:
                "There was an error loading your chapter. Error is: " + error,
              variant: "destructive",
            });
            addChapterIdToSet();
          },
        });
      },
    }));
    return (
      <div
        key={chapter.id}
        className={cn("px-4 py-2 mt-2 rounded flex justify-between", {
          "bg-secondary": success === null,
          "bg-red-500": success === false,
          "bg-green-500": success === true,
        })}
      >
        <h5>
          Chapter {chapterIndex + 1}: {chapter.name}
        </h5>
        {isPending && <Loader2 className="animate-spin" />}
      </div>
    );
  }
);

ChapterCard.displayName = "ChapterCard";

export default ChapterCard;
