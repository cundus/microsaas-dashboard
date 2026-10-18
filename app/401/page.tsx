import { AccessError } from "@/components/auth/access-error";

export const metadata = { title: "401 Unauthorized | MicroSaaS Admin" };

export default function UnauthorizedPage() {
  return <AccessError code={401} />;
}
