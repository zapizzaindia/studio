
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useDoc, useCollection, useFirestore } from "@/firebase";
import type { Review, Outlet, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const outletId = params.outletId as string;

  const { data: outlet, loading: outletLoading } = useDoc<Outlet>('outlets', outletId);
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const { data: reviews, loading: reviewsLoading } = useCollection<Review>(`outlets/${outletId}/reviews`);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }, [reviews]);

  const handleSubmitReview = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please sign in to share your experience.' });
      router.push('/login');
      return;
    }

    if (!comment.trim()) {
      toast({ variant: 'destructive', title: 'Missing Comment', description: 'Please write a brief review.' });
      return;
    }

    setIsSubmitting(true);
    const reviewData = {
      userId: user.uid,
      userName: userProfile?.displayName || user.displayName || 'Gourmet Customer',
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, `outlets/${outletId}/reviews`), reviewData);
      toast({ title: 'Review Shared!', description: 'Thank you for your feedback.' });
      setComment("");
      setRating(5);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, `outlets/${outletId}/reviews`, reviewId));
      toast({ title: 'Review Removed' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  if (outletLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black uppercase tracking-widest italic leading-none" style={{ color: brandColor }}>
            {outlet?.name || 'Store Reviews'}
          </h1>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Customer Wall</span>
        </div>
      </div>

      <div className="p-4 space-y-6 container max-w-lg mx-auto text-left">
        
        {/* Review Form */}
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 py-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: brandColor }}>
              <Star className="h-4 w-4" /> Share your experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      className={cn(
                        "h-10 w-10 transition-colors",
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                      )} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Disappointing'}
              </span>
            </div>

            <Textarea 
              placeholder="What did you love? How was the service?" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] rounded-2xl font-medium text-xs border-gray-100 bg-gray-50/50"
            />

            <Button 
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="w-full h-14 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  POST REVIEW <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#333]">All Reviews</h2>
            <Badge variant="secondary" className="text-[9px] font-black uppercase">{sortedReviews.length} Feedbacks</Badge>
          </div>

          <AnimatePresence mode="popLayout">
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
              ))
            ) : sortedReviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                <MessageSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-black uppercase italic" style={{ color: brandColor }}>No reviews yet</h3>
                <p className="text-muted-foreground text-xs uppercase font-bold px-8">Be the first one to share your thoughts about this outlet!</p>
              </div>
            ) : (
              sortedReviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gray-50 border flex items-center justify-center text-[#333] font-black italic">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase text-[#333] tracking-tight">{review.userName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={cn(
                                      "h-2.5 w-2.5",
                                      star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                    )} 
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Clock className="h-2 w-2" /> {format(review.createdAt.toDate(), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {user?.uid === review.userId && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                        <p className="text-sm font-medium text-[#444] leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-green-100 text-green-600 bg-green-50">
                          <CheckCircle2 className="h-2 w-2 mr-1" /> Verified Order
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
