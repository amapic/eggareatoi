export default function Screen3() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-2/3 bg-red-500 flex">
        <div className="flex flex-col w-1/4  bg-blue-500 flex items-center justify-center">
          <span className="text-2xl xl:text-8xl">+10</span>
          <span className="text-base xl:text-4xl">years experience</span>
        </div>
        <div className="flex flex-col w-1/4  bg-green-500 flex items-center justify-center">
          <span className="text-base xl:text-8xl">+1000</span>
          <span className="text-base xl:text-4xl">projects</span>
        </div>

        <div className="flex text-2xl xl:text-2xl w-1/4 bg-yellow-500 flex flex-col items-center justify-center">
          <span className="text-4xl xl:text-8xl">4</span>
          <span className="text-base xl:text-4xl">continents</span>
        </div>
        <div className="flex flex-col w-1/4 bg-purple-500 flex items-center justify-center">
          <span className="text-base xl:text-8xl">100%</span>
          <span className="text-base xl:text-4xl">satisfied customers</span>
        </div>
      </div>
    </div>
  );
}
