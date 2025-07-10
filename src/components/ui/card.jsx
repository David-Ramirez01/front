export const Card = ({ children, className }) => {
  return (
    <div className={`bg-white p-4 rounded shadow ${className || ""}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return <div className="p-2">{children}</div>;
};

