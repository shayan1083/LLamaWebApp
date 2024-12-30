import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList.tsx';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const ChatInterface = () => {
    // State Variables
    const [messages, setMessages] = useState<Message[]>([]); // stores chat history
    const [inputValue, setInputValue] = useState(''); // keeps track of user input in chatbox
    const [isLoading, setIsLoading] = useState(false); // indicates if a response is being generated

    // Server Sent Events Connection
    // EventSource object which manages connection to the server for real time updates
    const eventSourceRef = useRef<EventSource | null>(null);

    // Function to send a message
    const sendMessage = async (content: string) => {
        // Create a new user message object 
        const userMessage: Message = {
            id: uuidv4(),
            content,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]); // update the messages state with the users message
        setIsLoading(true); // indicate that a response is being generated

        // Create a placeholder for the bots response
        const botMessage: Message = {
            id: uuidv4(),
            content: '',
            sender: 'bot',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]); // add the bots response to the messages state

        // Open a SSE connection to fetch the response from the server
        const eventSource = new EventSource(`http://127.0.0.1:8000/generate_formatted?prompt=${encodeURIComponent(content)}`);
        eventSourceRef.current = eventSource;

        // Event handler for receiving server sent messages
        eventSource.onmessage = (event) => {
            console.log('on message')
            try {
                const data = JSON.parse(event.data); // parse the incoming data

                // update the bots message content as chunks are received
                setMessages(prev => prev.map(msg =>
                    msg.id === botMessage.id
                        ? {
                            ...msg,
                            content: msg.content + data.response
                        }
                        : msg
                ));

                // Close the connection if the response is complete
                if (data.response.includes("[DONE]") || data.done) {
                    eventSource.close();
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        };

        // Event handler for connection errors
        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            // Update the bots message to display an error message
            setMessages(prev => prev.map(msg =>
                msg.id === botMessage.id
                    ? { ...msg, content: msg.content || "Error receiving message. Please try again." }
                    : msg
            ));
            // Close the connection and reset the loading state
            eventSource.close();
            setIsLoading(false);
        };
    };
    // Function to handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // prevent default form submission behavior
        // Send the message if the input is not empty
        if (inputValue.trim()) {
            sendMessage(inputValue.trim());
            setInputValue('')
        }
    };


    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
            <div className={"bg-white rounded-lg shadow-lg flex flex-col h-[600px]"}>
                <div className="p-4 border-b">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Chat Assistant
                    </h1>
                </div>

                <MessageList messages={messages} isLoading={isLoading} />

                <div className="border-t p-4">
                    <form onSubmit={handleSubmit} className="flex space-x-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );


};

export default ChatInterface;
