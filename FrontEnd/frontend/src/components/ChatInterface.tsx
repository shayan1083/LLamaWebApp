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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    // Server Sent Events Connection
    // EventSource object which manages connection to the server for real time updates
    const eventSourceRef = useRef<EventSource | null>(null);


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadStatus('uploading');
            const formData = new FormData();
            formData.append('file', file);
            try {
                console.log('uploading file...')
                console.log('File in FormData:', formData.get('file'));
                const response = await fetch('http://127.0.0.1:8000/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error('Upload failed');
                }
                const data = await response.json();
                if (data.filename) {
                    console.log('file uploaded')
                    setActiveDocument(data.filename);
                    setSelectedFile(file);
                    setUploadStatus('success');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                setUploadStatus('error');
            }
        }

    };


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

        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('sessionId', sessionId);
        }
        // Create a placeholder for the bots response
        const botMessage: Message = {
            id: uuidv4(),
            content: '',
            sender: 'bot',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]); // add the bots response to the messages state

        // Open a SSE connection to fetch the response from the server
        const queryParams = new URLSearchParams({
            prompt: content,
            session_id: sessionId,
            ...(activeDocument && { file_name: activeDocument })
        });

        const eventSource = new EventSource(`http://127.0.0.1:8000/generate_formatted?prompt=${queryParams}`);
        eventSourceRef.current = eventSource;

        // Event handler for receiving server sent messages
        eventSource.onmessage = (event) => {
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
                {uploadStatus === 'uploading' && (
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700">
                        Uploading file...
                    </div>
                )}
                {uploadStatus === 'success' && activeDocument && (
                    <div className="px-4 py-2 bg-green-50 text-green-700 flex justify-between items-center">
                        <span>📄 Active Document: {activeDocument}</span>
                        <button
                            onClick={() => {
                                setActiveDocument(null);
                                setUploadStatus('idle');
                            }}
                            className="text-sm bg-green-100 px-2 py-1 rounded hover:bg-green-200"
                        >
                            Clear Document
                        </button>
                    </div>
                )}
                {uploadStatus === 'error' && (
                    <div className="px-4 py-2 bg-red-50 text-red-700">
                        Failed to upload file. Please try again.
                    </div>
                )}
                <div className="p-4 border-b">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Chat Assistant
                    </h1>
                </div>

                <MessageList messages={messages} isLoading={isLoading} />


                <div className="border-t p-4">

                    <form onSubmit={handleSubmit} className="flex space-x-4">
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            📎
                        </button>
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
