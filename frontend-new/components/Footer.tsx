import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="text-center"
      style={{ padding: "0rem", marginTop: "2rem" }}
    >
      <div className="flex justify-center items-center gap-1">
        <p className="text-gray-400">Made by EM & Nelson from <a href="https://sitcon.org" target="_blank" rel="noreferrer" className="underline">SITCON</a> with </p>
        <Heart size={16} className="text-red-700" />
      </div>
      <p className="text-sm text-gray-500">This project is open-sourced on <a href="https://github.com/sitcon/2026-tickets" target="_blank" rel="noreferrer" className="underline">Github</a></p>
    </footer>
  );
}
