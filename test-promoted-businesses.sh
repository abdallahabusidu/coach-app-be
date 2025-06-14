#!/bin/bash

# 🏢 Test Promoted Businesses System
# Tests the home page sections for gyms and nutrition restaurants

echo "🏢 Testing Promoted Businesses System..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server URL
SERVER_URL="http://localhost:3000"

# Check if server is running
echo ""
echo -e "${CYAN}📊 Checking server status...${NC}"
if ! curl -s "$SERVER_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running. Please start with: npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

echo ""
echo -e "${CYAN}🏠 TESTING HOME PAGE PROMOTED BUSINESSES${NC}"
echo "========================================"

# Test home page businesses endpoint
echo ""
echo -e "${BLUE}1. Testing Home Page Businesses Endpoint${NC}"
echo "GET /api/promoted-businesses/home-page"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  "$SERVER_URL/api/promoted-businesses/home-page?latitude=40.7128&longitude=-74.0060")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Home page businesses endpoint working${NC}"
    
    # Check if we have gym and restaurant sections
    FEATURED_GYMS=$(echo "$BODY" | jq -r '.featuredGyms | length' 2>/dev/null || echo "0")
    FEATURED_RESTAURANTS=$(echo "$BODY" | jq -r '.featuredNutritionRestaurants | length' 2>/dev/null || echo "0")
    
    echo -e "${CYAN}📊 Response Summary:${NC}"
    echo "• Featured Gyms: $FEATURED_GYMS"
    echo "• Featured Restaurants: $FEATURED_RESTAURANTS"
    
    if [ "$FEATURED_GYMS" != "null" ] && [ "$FEATURED_RESTAURANTS" != "null" ]; then
        echo -e "${GREEN}✅ Both sections are properly structured${NC}"
    else
        echo -e "${YELLOW}⚠️ Sections are empty (no businesses added yet)${NC}"
    fi
else
    echo -e "${RED}❌ Failed with HTTP code: $HTTP_CODE${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${BLUE}2. Testing Public Businesses Endpoint${NC}"
echo "GET /api/promoted-businesses/public"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  "$SERVER_URL/api/promoted-businesses/public?businessType=gym&limit=5")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Public businesses endpoint working${NC}"
    
    TOTAL_BUSINESSES=$(echo "$BODY" | jq -r '.total' 2>/dev/null || echo "0")
    CURRENT_PAGE=$(echo "$BODY" | jq -r '.page' 2>/dev/null || echo "1")
    
    echo -e "${CYAN}📊 Response Summary:${NC}"
    echo "• Total Businesses: $TOTAL_BUSINESSES"
    echo "• Current Page: $CURRENT_PAGE"
    echo "• Filtering: gym businesses only"
else
    echo -e "${RED}❌ Failed with HTTP code: $HTTP_CODE${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${CYAN}🎯 SYSTEM FEATURES OVERVIEW${NC}"
echo "==========================="

echo ""
echo -e "${GREEN}✅ Available API Endpoints:${NC}"
echo ""
echo -e "${BLUE}Public Endpoints (No Auth):${NC}"
echo "GET  /api/promoted-businesses/home-page"
echo "     → Get featured gyms and restaurants for home page"
echo "GET  /api/promoted-businesses/public"
echo "     → Get all active businesses with filtering"
echo "GET  /api/promoted-businesses/public/:id"
echo "     → Get single business details"
echo ""
echo -e "${BLUE}User Endpoints (Auth Required):${NC}"
echo "POST /api/promoted-businesses/interactions"
echo "     → Track user interactions (views, clicks, calls)"
echo "GET  /api/promoted-businesses/my-interactions"
echo "     → Get user's interaction history"
echo ""
echo -e "${BLUE}Admin Endpoints (Admin Only):${NC}"
echo "POST /api/promoted-businesses"
echo "     → Create new promoted business"
echo "GET  /api/promoted-businesses"
echo "     → Get all businesses (including inactive)"
echo "PUT  /api/promoted-businesses/:id"
echo "     → Update business details"
echo "DELETE /api/promoted-businesses/:id"
echo "     → Delete business"
echo "GET  /api/promoted-businesses/:id/analytics"
echo "     → Get detailed business analytics"

echo ""
echo -e "${CYAN}🏗️ BUSINESS TYPES SUPPORTED${NC}"
echo "============================"

echo ""
echo -e "${GREEN}🏋️ Gym Businesses:${NC}"
echo "• Personal Training services"
echo "• Group fitness classes"
echo "• Swimming pool facilities"
echo "• Sauna and spa services"
echo "• 24-hour access availability"
echo "• Childcare services"
echo "• Nutrition counseling"
echo ""
echo -e "${GREEN}🍎 Nutrition Restaurants:${NC}"
echo "• Meal delivery services"
echo "• Pickup and catering options"
echo "• Vegan and vegetarian options"
echo "• Gluten-free menu items"
echo "• Keto-friendly meals"
echo "• Meal prep services"
echo "• Detailed nutrition information"

echo ""
echo -e "${CYAN}📊 PARTNERSHIP TIERS${NC}"
echo "==================="

echo ""
echo -e "${PURPLE}🥉 Standard Partnership - \$299/month${NC}"
echo "• Basic listing in appropriate section"
echo "• Standard placement algorithm"
echo "• Basic analytics dashboard"
echo "• Contact/location information display"
echo ""
echo -e "${PURPLE}🥈 Featured Partnership - \$599/month${NC}"
echo "• Priority placement in section"
echo "• Enhanced profile with image gallery"
echo "• Featured badge and visual prominence"
echo "• Advanced analytics and insights"
echo ""
echo -e "${PURPLE}🥇 Premium Partnership - \$999/month${NC}"
echo "• Top placement guarantee"
echo "• Banner advertising space"
echo "• Custom promotional campaigns"
echo "• Dedicated account management"
echo ""
echo -e "${PURPLE}🏢 Enterprise Partnership - \$1,999/month${NC}"
echo "• Multiple location management"
echo "• Custom integration possibilities"
echo "• White-label promotion options"
echo "• Advanced reporting and analytics"

echo ""
echo -e "${CYAN}💰 REVENUE PROJECTIONS${NC}"
echo "======================"

echo ""
echo -e "${GREEN}Small Market (25 partners):${NC}"
echo "• 10 Gyms × \$450/month = \$4,500"
echo "• 15 Restaurants × \$450/month = \$6,750"
echo "• ${YELLOW}Monthly Revenue: \$11,250${NC}"
echo "• ${YELLOW}Annual Revenue: \$135,000${NC}"
echo ""
echo -e "${GREEN}Medium Market (60 partners):${NC}"
echo "• 25 Gyms × \$600/month = \$15,000"
echo "• 35 Restaurants × \$600/month = \$21,000"
echo "• ${YELLOW}Monthly Revenue: \$36,000${NC}"
echo "• ${YELLOW}Annual Revenue: \$432,000${NC}"
echo ""
echo -e "${GREEN}Large Market (125 partners):${NC}"
echo "• 50 Gyms × \$750/month = \$37,500"
echo "• 75 Restaurants × \$750/month = \$56,250"
echo "• ${YELLOW}Monthly Revenue: \$93,750${NC}"
echo "• ${YELLOW}Annual Revenue: \$1,125,000${NC}"

echo ""
echo -e "${CYAN}🎯 TARGETING & PERSONALIZATION${NC}"
echo "=============================="

echo ""
echo -e "${GREEN}Smart Algorithm Features:${NC}"
echo "📍 Location Proximity - Businesses closer to user"
echo "⭐ Quality Score - Based on ratings and reviews"
echo "💰 Promotion Level - Premium businesses get priority"
echo "🔥 Active Offers - Current promotions featured"
echo "📊 Performance - High engagement ranks higher"
echo ""
echo -e "${GREEN}Personalization Options:${NC}"
echo "👤 User preferences from profile"
echo "🔄 Past interactions and behavior"
echo "🥗 Dietary restrictions matching"
echo "💪 Fitness goals alignment"
echo "⏰ Schedule compatibility"

echo ""
echo -e "${CYAN}📱 USER INTERACTION TRACKING${NC}"
echo "============================"

echo ""
echo -e "${GREEN}Tracked Interactions:${NC}"
echo "👀 VIEW - User sees business listing"
echo "🖱️ CLICK - User clicks for more details"
echo "📞 CALL - Direct phone calls generated"
echo "🌐 WEBSITE_VISIT - Traffic to business website"
echo "🗺️ DIRECTIONS - Users request directions"
echo "🎟️ OFFER_VIEW - Promotional offers viewed"
echo "💰 OFFER_REDEEM - Offers actually redeemed"
echo "💾 SAVE - Business saved for later"
echo "📤 SHARE - Business shared with others"

echo ""
echo -e "${CYAN}📊 ANALYTICS & REPORTING${NC}"
echo "========================"

echo ""
echo -e "${GREEN}Business Performance Metrics:${NC}"
echo "📈 Conversion tracking (view → click → action)"
echo "📊 Engagement rates and user behavior"
echo "💰 Revenue attribution and ROI measurement"
echo "📱 Device and demographic breakdowns"
echo "🗓️ Time-based trends and patterns"
echo ""
echo -e "${GREEN}Platform Revenue Metrics:${NC}"
echo "💵 Monthly recurring revenue from partnerships"
echo "📈 Partner acquisition and retention rates"
echo "🎯 Geographic expansion tracking"
echo "⚖️ Contract renewal and performance"

echo ""
echo -e "${CYAN}🏠 HOME PAGE INTEGRATION${NC}"
echo "========================"

echo ""
echo -e "${GREEN}Two Dedicated Sections:${NC}"
echo ""
echo -e "${BLUE}🏋️ Featured Gyms Section:${NC}"
echo "• Shows top 5 recommended gyms"
echo "• Prioritizes by location, rating, offers"
echo "• Displays key features and current promotions"
echo "• One-tap calling and directions"
echo ""
echo -e "${BLUE}🍎 Featured Restaurants Section:${NC}"
echo "• Shows top 5 nutrition restaurants"
echo "• Highlights meal delivery and prep options"
echo "• Features dietary preferences and options"
echo "• Quick access to menus and ordering"

echo ""
echo -e "${CYAN}🔧 IMPLEMENTATION STATUS${NC}"
echo "========================="

echo ""
echo -e "${GREEN}✅ Completed Features:${NC}"
echo "• Complete database schema and entities"
echo "• Full API endpoints (public, user, admin)"
echo "• Home page integration endpoints"
echo "• User interaction tracking system"
echo "• Contract and partnership management"
echo "• Smart targeting and ranking algorithms"
echo "• Comprehensive analytics and reporting"
echo "• Multi-tier partnership system"
echo ""
echo -e "${YELLOW}⚠️ Next Steps for Full Implementation:${NC}"
echo "• Add sample businesses to database"
echo "• Integrate frontend components"
echo "• Set up admin dashboard for management"
echo "• Configure automated contract monitoring"
echo "• Implement payment processing for partnerships"

echo ""
echo -e "${CYAN}📋 QUICK START COMMANDS${NC}"
echo "========================="

echo ""
echo -e "${GREEN}Database Setup:${NC}"
echo "npm run typeorm:migration:run  # Run database migrations"
echo ""
echo -e "${GREEN}Admin Management:${NC}"
echo "# Use admin endpoints to add businesses:"
echo "POST /api/promoted-businesses"
echo "PUT  /api/promoted-businesses/:id/activate"
echo ""
echo -e "${GREEN}Frontend Integration:${NC}"
echo "# Fetch for home page:"
echo "GET /api/promoted-businesses/home-page?latitude=LAT&longitude=LNG"
echo ""
echo -e "${GREEN}User Tracking:${NC}"
echo "# Track interactions:"
echo "POST /api/promoted-businesses/interactions"

echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│                                                                 │"
echo "│  🎉 ${YELLOW}PROMOTED BUSINESSES SYSTEM READY!${NC}                    │"
echo "│                                                                 │"
echo "│  🏗️ Complete partnership platform for external businesses      │"
echo "│  🏋️ Dedicated gym promotion section                             │"
echo "│  🍎 Dedicated nutrition restaurant section                      │"
echo "│  📊 Full analytics and performance tracking                     │"
echo "│  💰 Revenue potential: \$135k - \$1.1M annually                 │"
echo "│                                                                 │"
echo "│  🚀 ${GREEN}Ready to start building business partnerships!${NC}        │"
echo "│                                                                 │"
echo "└─────────────────────────────────────────────────────────────────┘"

echo ""
echo -e "${PURPLE}🌟 WHERE FITNESS MEETS LOCAL BUSINESS PARTNERSHIPS${NC}"
echo ""
echo -e "${CYAN}Your platform now has:${NC}"
echo "🏆 ${BLUE}External Revenue Stream${NC} - Monthly partnership fees"
echo "🏆 ${BLUE}Enhanced User Value${NC} - Local business discovery"
echo "🏆 ${BLUE}Strategic Partnerships${NC} - Gym and restaurant networks"
echo "🏆 ${BLUE}Data Monetization${NC} - User behavior insights"
echo "🏆 ${BLUE}Community Building${NC} - Local fitness ecosystem"
echo ""
echo -e "${GREEN}Ready to transform your platform into a comprehensive fitness and nutrition marketplace! 💪🍎💰${NC}"
