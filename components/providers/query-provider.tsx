"use client"
import {QueryClient,QueryClientProvider} from "@tanstack/react-query"
import {useState} from "react"

export function QueryProvider({children}:{children:React.ReactElement.ReactNode}){
    const [client]=useState(()=>new QueryClient() )

    return (
        <QueryClientProvider client={cleint}>
            {children}
        </QueryClientProvider>
    )
}