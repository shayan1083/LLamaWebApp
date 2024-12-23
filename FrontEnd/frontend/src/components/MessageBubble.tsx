import React from 'react'

interface MessageBubbleProps {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const MessageBubble = ({ content, sender, timestamp }: MessageBubbleProps) => {
    const isUser = sender === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-4 ${isUser
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                <p className="whitespace-pre-wrap break-words">
                    {content}
                </p>
                <div className={`text-sx mt-2 ${
                    isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                    {timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        </div>
    )
}

export default MessageBubble