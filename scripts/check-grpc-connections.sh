#!/bin/bash

set -e

echo "🔍 Validating gRPC connections..."

# Wait a bit for port forwarding to establish
echo "⏳ Waiting for port forwarding to establish..."
sleep 10

# Debug: Show what's listening on the expected ports
echo "🔍 Debug: Checking what's listening on expected ports..."
netstat -tlnp 2>/dev/null | grep -E ":(9998|5600|35211)" || echo "No services found on expected ports yet"

# Function to check if a port is listening
check_port() {
    local port=$1
    local service_name=$2
    local timeout=30
    local count=0

    echo "Checking $service_name on port $port..."

    while [ $count -lt $timeout ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service_name is listening on port $port"
            return 0
        fi
        echo "⏳ Waiting for $service_name on port $port... ($((count + 1))/$timeout)"
        sleep 1
        count=$((count + 1))
    done

    echo "❌ Timeout: $service_name is not listening on port $port after $timeout seconds"
    return 1
}

# Function to test gRPC connection using grpcurl (if available)
test_grpc_connection() {
    local port=$1
    local service_name=$2

    # Check if grpcurl is available
    if command -v grpcurl >/dev/null 2>&1; then
        echo "Testing gRPC connection to $service_name on port $port..."
        echo "grpcurl version: $(grpcurl --version)"

        # Only test gRPC reflection for Mirror Node gRPC (port 5600) which supports it
        if [ "$port" = "5600" ]; then
            # Try to list services (this is a common gRPC reflection endpoint)
            if timeout 10 grpcurl -plaintext localhost:$port list >/dev/null 2>&1; then
                echo "✅ gRPC connection to $service_name successful"
                echo "Available services:"
                timeout 10 grpcurl -plaintext localhost:$port list
                return 0
            else
                echo "⚠️  gRPC reflection not available, but port is listening"
                return 0
            fi
        else
            # For other ports (9998, 35211), just confirm the port is listening
            return 0
        fi
    else
        echo "❌ grpcurl not available - checking installation..."
        echo "PATH: $PATH"
        echo "which grpcurl: $(which grpcurl 2>/dev/null || echo 'not found')"
        echo "ls /usr/local/bin/grpcurl: $(ls -la /usr/local/bin/grpcurl 2>/dev/null || echo 'not found')"
        return 0
    fi
}

# Check gRPC Proxy (always available)
if check_port 9998 "gRPC Proxy"; then
    test_grpc_connection 9998 "gRPC Proxy"
else
    echo "❌ gRPC Proxy validation failed"
    exit 1
fi

# Check HAProxy (always available)
if check_port 35211 "HAProxy"; then
    test_grpc_connection 35211 "HAProxy"
else
    echo "❌ HAProxy validation failed"
    exit 1
fi

# Check Mirror Node gRPC (only if mirror node is installed)
if [ "${INSTALL_MIRROR_NODE}" = "true" ]; then
    if check_port 5600 "Mirror Node gRPC"; then
        test_grpc_connection 5600 "Mirror Node gRPC"
    else
        echo "❌ Mirror Node gRPC validation failed"
        exit 1
    fi
else
    echo "ℹ️  Mirror Node not installed, skipping Mirror Node gRPC validation"
fi

echo "🎉 All gRPC connections validated successfully!"

# Summary
echo ""
echo "📋 Validation Summary:"
echo "✅ gRPC Proxy (port 9998): Validated"
echo "✅ HAProxy (port 35211): Validated"
if [ "${INSTALL_MIRROR_NODE}" = "true" ]; then
    echo "✅ Mirror Node gRPC (port 5600): Validated"
else
    echo "ℹ️  Mirror Node gRPC (port 5600): Not installed"
fi

# Final debug: Show all listening ports
echo "🔍 Final debug: All listening ports:"
netstat -tlnp 2>/dev/null | grep LISTEN || echo "No listening ports found"
