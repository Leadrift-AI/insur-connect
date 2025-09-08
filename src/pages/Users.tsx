import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserManagement } from '@/components/users/UserManagement';

const Users = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <UserManagement />
      </div>
    </DashboardLayout>
  );
};

export default Users;