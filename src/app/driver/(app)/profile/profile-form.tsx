'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/form';
import { saveProfile, type DriverActionState } from '../../actions';

type Props = {
  phone: string | null;
  vehicleType: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
};

export function ProfileForm({ phone, vehicleType, vehicleModel, vehiclePlate }: Props) {
  const [state, action, pending] = useActionState<DriverActionState, FormData>(saveProfile, {});
  return (
    <form action={action} noValidate>
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        defaultValue={phone ?? ''}
        autoComplete="tel"
      />
      <Select label="Vehicle" name="vehicleType" defaultValue={vehicleType ?? ''}>
        <option value="" disabled>
          Choose your vehicle
        </option>
        <option value="bike">Bicycle</option>
        <option value="scooter">Scooter</option>
        <option value="car">Car</option>
      </Select>
      <Field
        label="Model"
        name="vehicleModel"
        defaultValue={vehicleModel ?? ''}
        placeholder="Honda Dio"
      />
      <Field
        label="Number plate"
        name="vehiclePlate"
        defaultValue={vehiclePlate ?? ''}
        placeholder="CA 123 456"
      />
      {state.error && (
        <p role="alert" className="mb-3 text-base text-danger">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="mb-3 text-base font-semibold">
          Saved
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving' : 'Save'}
      </Button>
    </form>
  );
}
