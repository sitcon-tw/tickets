import { ReactNode } from "react";

type DescriptionProps = {
  children: ReactNode;
};

export default function Description({ children }: DescriptionProps) {
  return <div style={{
    margin: "1rem 0",
    padding: "1rem",
    backgroundColor: "#464646",
    borderLeft: "3px solid #007acc",
    fontSize: "0.9rem",
    lineHeight: 1.4
  }}>
    {children}
  </div>;
}
