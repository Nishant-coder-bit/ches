import { faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";


const mockChatMessages = ["User1: Hello!", "User2: Hi there!"];
export const ChatComponent = () => {
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
      };
  const sendChatMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, `You: ${chatInput}`]); // Mock sending message
      setChatInput("");
    }
  };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Game Chat
            </h2>
            <button onClick={toggleChat} className="focus:outline-none">
              <FontAwesomeIcon
                icon={faTimes}
                className="text-gray-600 hover:text-gray-800"
              />
            </button>
          </div>
          <div className="h-64 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className="mb-2 p-2 rounded-md bg-gray-100 text-gray-800 text-sm"
              >
                {msg}
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              className="flex-1 p-2 border rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(event) =>
                event.key === "Enter" ? sendChatMessage() : null
              }
            />
            <button
              onClick={sendChatMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 focus:outline-none"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>
    );
}