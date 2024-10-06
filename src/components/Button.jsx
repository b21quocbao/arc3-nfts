import Spinner from "./Spinner";

const Button = ({ type = 'button', label, onClick, disabled = false, isLoading = false }) => {
  return (
    <button
      type={type}
      className="flex space-x-4 bg-teal-700 text-white rounded-md p-2 hover:text-white focus:outline-none focus:text-white focus:bg-teal-600"
      onClick={onClick}
      disabled={disabled}
    >
      {isLoading && <Spinner />}
      {label}
    </button>
  );
};

export default Button;