export interface Review {
  _id: string;
  ratingUser: {
    _id: string;
    fullName: string;
    avatar: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

export interface RatingDistributionItem {
  stars: number;
  count: number;
  percentage: number;
}

export interface ProfileData {
  user: {
    id: string;
    fullName: string;
    avatar: string;
    memberSince: string;
  };
  stats: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<number, number>;
  };
  ratings: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
