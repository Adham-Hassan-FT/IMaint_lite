import Header from "./Header";
import { ReactNode } from "react";

interface TopNavProps {
  children?: ReactNode;
}

export default function TopNav({ children }: TopNavProps) {
  return <Header menuTrigger={children} />;
}
