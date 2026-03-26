import React from "react";
import {
  useForm,
  useFormContext,
  FormProvider,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { Input } from "./input";
import { Label } from "./label";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  rules?: RegisterOptions<T, Path<T>>;
  description?: string;
}

export interface ReusableFormProps<T extends FieldValues> {
  fields: FormFieldProps<T>[];
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  submitLabel?: string;
  isLoading?: boolean;
}

// ─── FormField (Standalone) ───────────────────────────────────────────────────
// Bisa dipakai sendiri di dalam <FormProvider> tanpa harus pakai <ReusableForm>

export function FormField<T extends FieldValues>({
  name,
  label,
  placeholder,
  type = "text",
  rules,
  description,
}: FormFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={String(name)}>
        {label}
        {rules?.required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      <Input
        id={String(name)}
        type={type}
        placeholder={placeholder}
        aria-describedby={
          description || error ? `${String(name)}-desc` : undefined
        }
        aria-invalid={!!error}
        className={
          error ? "border-destructive focus-visible:ring-destructive" : ""
        }
        {...register(name, rules)}
      />

      {(description || error) && (
        <p
          id={`${String(name)}-desc`}
          className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {error ?? description}
        </p>
      )}
    </div>
  );
}

// ─── ReusableForm ─────────────────────────────────────────────────────────────
// Wrapper lengkap jika ingin pakai sekaligus dengan onSubmit

export function ReusableForm<T extends FieldValues>({
  fields,
  onSubmit,
  defaultValues,
  submitLabel = "Submit",
  isLoading = false,
}: ReusableFormProps<T>) {
  const methods = useForm<T>({ defaultValues: defaultValues as T });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const busy = isLoading || isSubmitting;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {fields.map((field) => (
          <FormField<T> key={String(field.name)} {...field} />
        ))}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {busy ? "Loading…" : submitLabel}
        </button>
      </form>
    </FormProvider>
  );
}

export default ReusableForm;

// ─── Usage: ReusableForm (all-in-one) ────────────────────────────────────────
//
// <ReusableForm<{ email: string; password: string }>
//   fields={[
//     { name: "email", label: "Email", type: "email", rules: { required: "Required" } },
//     { name: "password", label: "Password", type: "password" },
//   ]}
//   onSubmit={(data) => console.log(data)}
// />

// ─── Usage: FormField standalone (custom layout) ─────────────────────────────
//
// const methods = useForm<{ name: string; bio: string }>();
//
// <FormProvider {...methods}>
//   <form onSubmit={methods.handleSubmit(onSubmit)}>
//     <div className="grid grid-cols-2 gap-4">
//       <FormField name="name" label="Name" rules={{ required: "Required" }} />
//       <FormField name="bio" label="Bio" placeholder="Tell us about you" />
//     </div>
//     <button type="submit">Save</button>
//   </form>
// </FormProvider>
