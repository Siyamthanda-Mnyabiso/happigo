import { createItem } from '../actions';
import { ItemForm } from '../item-form';

export default function NewItemPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Add item</h1>
      <ItemForm
        action={createItem}
        submitLabel="Add item"
        values={{
          name: '',
          price: '',
          category: '',
          description: '',
          available: true,
          popular: false,
        }}
      />
    </>
  );
}
