export const Button = ({ variant = "primary", className, ...props }) => {
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-gray-400 text-gray-700",
    ghost: "bg-transparent text-gray-700",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
  };

  return (
    <button
      {...props}
      className={`py-2 px-4 rounded ${variants[variant]} ${className || ""}`}
    />
  );
};

