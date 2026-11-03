import { CheckIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/layout';
import { PLAN_LIST } from '@/lib/plans';
import { savePlan } from './actions';

export default function ChoosePlanPage() {
  return (
    <Screen>
      <p className="mt-4 font-medium text-muted">Step 2 of 3</p>
      <h1 className="text-2xl font-extrabold">One flat monthly fee</h1>
      <p className="mb-6 text-muted">No commission on any order, ever.</p>
      <form action={savePlan} className="flex flex-1 flex-col">
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">Plan</legend>
          {PLAN_LIST.map((p, i) => (
            <label
              key={p.id}
              className="relative block cursor-pointer rounded-[22px] border border-line p-5 has-checked:border-2 has-checked:border-brand has-focus-visible:outline-2 has-focus-visible:outline-brand"
            >
              <input
                type="radio"
                name="plan"
                value={p.id}
                defaultChecked={i === 0}
                className="peer absolute right-5 top-5 size-[22px] accent-brand"
              />
              <span className="block pr-10 text-lg font-bold">{p.name}</span>
              <span className="mt-1 block text-muted">{p.description}</span>
              <span className="mt-4 block font-semibold">{p.feeNote}</span>
              <ul className="mt-3 space-y-1 font-medium">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <CheckIcon weight="bold" className="size-5 text-brand" aria-hidden /> {perk}
                  </li>
                ))}
              </ul>
            </label>
          ))}
        </fieldset>
        <div className="mt-auto pt-8">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Screen>
  );
}
