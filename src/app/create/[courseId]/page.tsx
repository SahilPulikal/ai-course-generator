import React from "react";

type Props = {
  params: {
    courseId: string;
  };
};

const CreateChapters = ({ params: { courseId } }: Props) => {
  return <div>{courseId}</div>;
};

export default CreateChapters;
