import type { FC } from 'react'

interface TrainingFeedbackProps {
  feedback: { message: string; type: 'hit' | 'miss' } | null
}

export const TrainingFeedback: FC<TrainingFeedbackProps> = ({ feedback }) => {
  if (!feedback) return null

  return (
    <div className={`training-feedback training-feedback--${feedback.type}`}>
      <span className="training-feedback__text">{feedback.message}</span>
    </div>
  )
}