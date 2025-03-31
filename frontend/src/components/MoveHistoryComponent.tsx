import React, { useEffect, useState } from "react";

type Move = {
    from: string;
    to: string;
  };
  
export const MoveHistoryComponent = React.memo(({ movesState }: { movesState: Move[] }) => {
    const [formattedMoves, setFormattedMoves] = useState<Array<{ moveNumber: number, whiteMove?: string, blackMove?: string }>>([]);
  
    useEffect(() => {
      const newFormattedMoves: Array<{ moveNumber: number, whiteMove?: string, blackMove?: string }> = [];
      let moveNumber = 1;
      for (let i = 0; i < movesState.length; i += 2) {
        newFormattedMoves.push({
          moveNumber,
          whiteMove: movesState[i] ? `${movesState[i].from}-${movesState[i].to}` : undefined,
          blackMove: movesState[i + 1] ? `${movesState[i + 1].from}-${movesState[i + 1].to}` : undefined,
        });
        moveNumber++;
      }
      setFormattedMoves(newFormattedMoves);
    }, [movesState]);
  
    return (
      <div className="bg-gray-50 p-4 rounded-md shadow-inner max-h-60 overflow-y-auto w-full md:w-64">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="font-semibold">#</div>
          <div className="font-semibold text-center">White</div>
          <div className="font-semibold text-center">Black</div>
          {formattedMoves.map((move, index) => (
            <React.Fragment key={index}>
              <div>{move.moveNumber}</div>
              <div className="text-center">{move.whiteMove}</div>
              <div className="text-center">{move.blackMove}</div>
            </React.Fragment>
          ))}
        </div>
        {movesState.length === 0 && <p className="text-sm text-gray-500">Start a new game to see moves.</p>}
      </div>
    );
  });