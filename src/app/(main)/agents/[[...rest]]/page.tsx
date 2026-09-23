import { redirect } from "next/navigation";

/** 에이전트 관리는 대화 화면으로 합쳤다. 예전 주소로 들어오면 대화로 보낸다. */
export default function AgentsMoved() {
  redirect("/chat");
}
