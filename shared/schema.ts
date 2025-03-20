import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  searchCount: integer("search_count").notNull().default(0),
  pcSearchRatio: integer("pc_search_ratio").notNull().default(0),
  mobileSearchRatio: integer("mobile_search_ratio").notNull().default(0),
  productCount: integer("product_count").notNull().default(0),
  averagePrice: integer("average_price").notNull().default(0),
  totalSales: integer("total_sales").notNull().default(0),
  totalSalesCount: integer("total_sales_count").notNull().default(0),
  competitionIndex: integer("competition_index").notNull().default(0),
  realProductRatio: integer("real_product_ratio").notNull().default(0),
  foreignProductRatio: integer("foreign_product_ratio").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const keywordTrends = pgTable("keyword_trends", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: timestamp("date").notNull(),
  searchCount: integer("search_count").notNull().default(0),
});

export const insertKeywordTrendSchema = createInsertSchema(keywordTrends).omit({
  id: true
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(),
  title: text("title").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
  brandName: text("brand_name").notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  productUrl: text("product_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const trackedProducts = pgTable("tracked_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  keywordId: integer("keyword_id").notNull(),
  currentRank: integer("current_rank").notNull().default(0),
  previousRank: integer("previous_rank").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTrackedProductSchema = createInsertSchema(trackedProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeywordTrend = z.infer<typeof insertKeywordTrendSchema>;
export type KeywordTrend = typeof keywordTrends.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertTrackedProduct = z.infer<typeof insertTrackedProductSchema>;
export type TrackedProduct = typeof trackedProducts.$inferSelect;

// API Response types
export interface NaverKeywordResult {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  competitionIndex: number;
  relatedKeywords: string[];
}

export interface NaverProductResult {
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brandName: string;
  mall?: string;      // 판매 쇼핑몰 정보 추가
  reviewCount: number;
  rank: number;
  productUrl: string;
}

export interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt: string;
}

export interface MonitoringThresholds {
  priceChangePercent: number;
  newProduct: boolean;
  rankChange: boolean;
  reviewChangePercent: number;
}

export interface MonitoringConfig {
  keyword: string;
  competitors: string[];
  createdAt: string;
  lastUpdated: string;
  monitorFrequency: 'daily' | 'weekly';
  alertThresholds: MonitoringThresholds;
}

export interface PriceChange {
  product: CompetitorProduct;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

export interface RankChange {
  product: CompetitorProduct;
  oldRank: number;
  newRank: number;
  change: number; // 양수: 순위 상승, 음수: 순위 하락
}

export interface ReviewChange {
  product: CompetitorProduct;
  oldReviews: number;
  newReviews: number;
  changePercent: number;
}

export interface NewProductAlert {
  product: CompetitorProduct;
  type: 'new_product';
}

export interface CompetitorChanges {
  priceChanges: PriceChange[];
  newProducts: NewProductAlert[];
  rankChanges: RankChange[];
  reviewChanges: ReviewChange[];
  alerts: boolean;
}

export interface MonitoringResult {
  keyword: string;
  checkedAt: string;
  changesDetected: Record<string, CompetitorChanges>;
  hasAlerts: boolean;
}

export interface NaverTrendResult {
  keyword: string;
  trends: Array<{
    date: string;
    count: number;
  }>;
}

export interface KeywordSearchResponse {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  productCount: number;
  averagePrice: number;
  totalSales: number;
  totalSalesCount: number;
  competitionIndex: number;
  realProductRatio: number;
  foreignProductRatio: number;
  products: NaverProductResult[];
  relatedKeywords: string[];
  trends: {
    date: string;
    count: number;
  }[];
}

export interface CategoryTrendResponse {
  category: string;
  keywords: Array<{
    keyword: string;
    rank: number;
    change: 'up' | 'down' | 'same';
  }>;
  products: NaverProductResult[];
}
