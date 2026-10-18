import { AccessError } from "@/components/auth/access-error";

export const metadata = { title: "403 Forbidden | MicroSaaS Admin" };

export default function ForbiddenPage() {
  return <AccessError code={403} />;
}
