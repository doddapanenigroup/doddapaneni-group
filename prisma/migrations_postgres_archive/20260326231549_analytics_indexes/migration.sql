-- CreateIndex
CREATE INDEX "Visit_visited_at_idx" ON "Visit"("visited_at" DESC);

-- CreateIndex
CREATE INDEX "Visit_page_path_visited_at_idx" ON "Visit"("page_path", "visited_at");

-- CreateIndex
CREATE INDEX "WebVitalReport_created_at_idx" ON "WebVitalReport"("created_at" DESC);

-- CreateIndex
CREATE INDEX "WebVitalReport_name_created_at_idx" ON "WebVitalReport"("name", "created_at");
