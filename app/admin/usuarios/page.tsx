import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { UsersTable } from "components/admin/users-table";
import Footer from "components/layout/footer";
import { usersStorage } from "lib/auth/users-storage";

export const metadata: Metadata = {
  title: "Admin — Usuarios",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const users = (await usersStorage.getAll()).map(
    ({ passwordHash: _passwordHash, ...user }) => user,
  );

  return (
    <>
      <AdminShell title="Usuarios">
        <UsersTable initialUsers={users} />
      </AdminShell>
      <Footer />
    </>
  );
}
