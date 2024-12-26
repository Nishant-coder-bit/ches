
type moves = {
    from:string,
    to:string
}
export const MoveState = ({movesState}:{movesState:moves[]})=>{
    return (
        <div style={{backgroundColor:"#f0d9b5"}} className=" flex flex-col items-center justify-center md:w-3/4 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Moves</h1>
        <div className="flex flex-row space-x-20 mb-4">
          <h1> From</h1>
          <h1> To</h1>
        </div>
        <div className="flex flex-col space-y-4">
          {movesState.map((move, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="flex flex-row  space-x-20">
             
          <div className="flex flex-row "> 
          <div className="pr-4">{index +1}.</div> 
            {move.from}</div>
          <div className="pr-3"> {move.to}</div>
        </div>
            </div>
          ))}
        </div>
      </div>
    )
}