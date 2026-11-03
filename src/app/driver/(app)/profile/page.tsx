import { Button } from '@/components/ui/button';
import { getDriver } from '@/lib/driver';
import { signOut } from '../../actions';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const { driver, name, user } = await getDriver();
  return (
    <>
      <h1 className="text-3xl font-extrabold">Profile</h1>
      <p className="font-semibold">{name}</p>
      <p className="mb-6 text-muted">{user.email}</p>
      <ProfileForm
        phone={driver.phone}
        vehicleType={driver.vehicle_type}
        vehicleModel={driver.vehicle_model}
        vehiclePlate={driver.vehicle_plate}
      />
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="secondary">
          Log out
        </Button>
      </form>
    </>
  );
}
