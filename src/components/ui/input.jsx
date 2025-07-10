export const Input = (props) => {
  return (
    <input
      {...props}
      className={`border border-gray-300 p-2 w-full rounded mb-2 ${props.className || ""}`}
    />
  );
};

