import Link from "next/link";
export default function NotFound() {
  return (
    <section>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link href="/">현장 가이드로 이동</Link>
    </section>
  );
}
