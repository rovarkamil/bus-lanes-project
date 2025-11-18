/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import React from "react";
import { RenderContext } from "@/types/data-table";

export const renderIndexColumn = <T,>(
  _: T,
  context: RenderContext<T>
): JSX.Element => {
  return <span>{context.index + 1}</span>;
};
