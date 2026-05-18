export const LinenPattern = ({ className }: { className?: string }) => (
  <div
    className={`absolute inset-0 opacity-10 pointer-events-none ${className ?? ""}`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
    }}
  />
);
