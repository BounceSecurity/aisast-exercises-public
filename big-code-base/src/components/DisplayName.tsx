interface DisplayNameProps {
  name: string;
  className?: string;
  "data-testid"?: string;
}

export default function DisplayName({ name, className, "data-testid": testId }: DisplayNameProps) {
  return (
    <span
      className={className}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: name }}
    />
  );
}
