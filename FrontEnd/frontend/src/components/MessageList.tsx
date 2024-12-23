import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.tsx';

interface Message {
    id: string;
    content: string;
    sender: 'user'|'bot';
    timestamp: Date;
}

interface MessageListProps {
    messages: Message[];
    isLoading?: boolean
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                    <p>Start a conversation by sending a message!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {messages.map((message) => (
                        <MessageBubble
                            id={message.id}
                            content={message.content}
                            sender={message.sender}
                            timestamp={message.timestamp}
                        />
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-4 max-w-[70%]">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;