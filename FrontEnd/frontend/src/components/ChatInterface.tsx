import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList.tsx';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const ChatInterface = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (content: string) => {
        const userMessage: Message = {
            id: uuidv4(),
            content,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/answerquestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: content }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const answer = await response.text();

            const botMessage: Message = {
                id: uuidv4(),
                content: answer,
                sender: 'bot',
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message: ', error);
            const errorMessage: Message = {
                id: uuidv4(),
                content: "Sorry, I couldn't process your message. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
