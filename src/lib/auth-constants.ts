export type AppRole = "jobseeker" | "employer" | "admin";

export const roleHome: Record<AppRole, string> = {
  jobseeker: "/jobseeker",
  employer: "/employer",
  admin: "/admin",
};
