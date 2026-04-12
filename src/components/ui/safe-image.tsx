"use client";

import React from "react";
import Image from "next/image";

export const SafeImage = ({ src, alt, ...props }: any) => (
  <Image
    src={src || "/placeholder.png"}
    alt={alt || "Image"}
    {...props}
  />
);
