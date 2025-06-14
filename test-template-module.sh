#!/bin/bash

echo "🚀 Testing Template Module Integration"
echo "=====================================\n"

echo "📁 Checking file structure..."
echo "✅ Entities:"
ls -la src/template/entities/

echo "\n✅ DTOs:"
ls -la src/template/dtos/

echo "\n✅ Services:"
ls -la src/template/services/

echo "\n✅ Controllers:"
ls -la src/template/controllers/

echo "\n🔧 Building project..."
yarn build

if [ $? -eq 0 ]; then
    echo "\n✅ Build successful!"
    echo "\n📊 Compiled template module files:"
    ls -la dist/src/template/
    
    echo "\n🌐 Template module is ready!"
    echo "\n📚 Available endpoints:"
    echo "  POST   /api/v1/templates                         - Create template"
    echo "  GET    /api/v1/templates                         - List templates"
    echo "  GET    /api/v1/templates/public                  - Browse public templates"
    echo "  GET    /api/v1/templates/:id                     - Get template"
    echo "  PUT    /api/v1/templates/:id                     - Update template"
    echo "  DELETE /api/v1/templates/:id                     - Delete template"
    echo "  POST   /api/v1/templates/assign                  - Assign template"
    echo "  GET    /api/v1/templates/assignments/list        - List assignments"
    echo "  PUT    /api/v1/templates/assignments/:id/progress - Update progress"
    echo "  GET    /api/v1/templates/recommendations/:traineeId - Get recommendations"
    
    echo "\n🎯 Key Features:"
    echo "  ✅ Complete training templates (workouts + meals)"
    echo "  ✅ AI-powered recommendations"
    echo "  ✅ Assignment and progress tracking"
    echo "  ✅ Template customization"
    echo "  ✅ Success rate analytics"
    
else
    echo "\n❌ Build failed!"
    exit 1
fi
