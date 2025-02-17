export function Logo() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200"
      aria-labelledby="logoTitle"
      role="img"
    >
      <title id="logoTitle" className="sr-only">PolyChat Logo</title>
      <path fill="#4CAF50" stroke="#333" stroke-width="3" d="m50 100 20-40 40-10 30 20 10 30-30 30H80z" />
      <path fill="#FF9800" stroke="#333" stroke-width="3" d="m140 70 30-10-10 30-10 10z" />
      <path fill="#AED581" stroke="#333" stroke-width="3" d="m80 45 10-20 10 20z" />
      <circle cx="100" cy="70" r="4" fill="#333" />
    </svg>
  );
}
