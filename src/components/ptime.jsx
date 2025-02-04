import React from "react";
import { Clock } from "react-feather"; // Если используете иконку Clock
import { formatDistanceToNow } from "date-fns";

const PostTimestamp = ({ publishedAt }) => {
  return (
    <div className="flex items-center space-x-2">
      <Clock size={20} className="text-gray-500" />
      <span>
        {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
      </span>
    </div>
  );
};

export default PostTimestamp;
