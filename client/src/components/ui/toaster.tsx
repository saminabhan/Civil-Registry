import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useState } from "react"

const DEFAULT_DURATION = 3000

function ToastWithProgress({ 
  id, 
  title, 
  description, 
  action, 
  variant, 
  className, 
  duration = DEFAULT_DURATION,
  ...props 
}: any) {
  const isSuccess = variant !== "destructive"
  const [isVisible, setIsVisible] = useState(true)
  const progress = useMotionValue(100)
  const scaleX = useTransform(progress, [100, 0], [1, 0])

  useEffect(() => {
    // Reset progress to 100 when toast is created
    progress.set(100)
    setIsVisible(true)
    
    // Animate progress bar from 100% to 0%
    const controls = animate(progress, 0, {
      duration: duration / 1000, // Convert to seconds
      ease: "linear",
    })

    // Hide toast when progress reaches 0
    const timeout = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => {
      controls.stop()
      clearTimeout(timeout)
    }
  }, [id, duration]) // Use id instead of progress to restart animation for new toasts

  if (!isVisible) return null

  return (
    <Toast 
      {...props} 
      variant={variant}
      className={`${className || ''} backdrop-blur-sm relative overflow-hidden`}
    >
      {/* Progress Bar */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1 ${
          isSuccess ? 'bg-primary' : 'bg-destructive'
        }`}
        style={{
          scaleX,
          transformOrigin: "left",
        }}
      />
      
      <div className="flex items-start gap-3 w-full">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`flex-shrink-0 mt-0.5 ${
            isSuccess ? 'text-primary' : 'text-destructive'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </motion.div>
        
        {/* Content */}
        <div className="grid gap-1 flex-1">
          {title && (
            <ToastTitle className="text-base font-semibold">
              {title}
            </ToastTitle>
          )}
          {description && (
            <ToastDescription className="text-sm opacity-90">
              {description}
            </ToastDescription>
          )}
        </div>
        
        {/* Action */}
        {action}
        
        {/* Close Button */}
        <ToastClose className="mt-0.5" />
      </div>
    </Toast>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, className, duration, ...props }) {
        return (
          <ToastWithProgress
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            variant={variant}
            className={className}
            duration={duration}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
