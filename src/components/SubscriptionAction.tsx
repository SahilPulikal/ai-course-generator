"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";

type Props = {};

const SubscriptionAction = (props: Props) => {
  const { data } = useSession(); //for fetching current user data using next-auth useSession function
  return (
    <div className="flex flex-col items-center w-1/2 p-4 mx-auto mt-4 rounded-md bg-secondary">
      {data?.user.credits} / 10 Free Generations
      <Progress
        className="mt-2"
        value={data?.user.credits ? (data.user.credits / 10) * 100 : 0}
      />
      <Button className="mt-3 font-bold text-white transition bg-gradient-to-tr from-green-400 to-blue-500 hover:to-blue-600">
        Upgrade
        <Zap className="fill-white ml-2" />
      </Button>
    </div>
    // <div>SubscriptionAction</div>
  );
};

export default SubscriptionAction;
