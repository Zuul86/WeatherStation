using System;
using System.Net.Sockets;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("Starting TCP connection test...");
        
        try
        {
            using var client1 = new TcpClient();
            Console.WriteLine("Attempting to connect to 127.0.0.1:10002...");
            await client1.ConnectAsync("127.0.0.1", 10002).WaitAsync(TimeSpan.FromMilliseconds(500));
            Console.WriteLine("Connected to 127.0.0.1:10002!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to connect to 127.0.0.1:10002: {ex.Message}");
        }

        try
        {
            using var client2 = new TcpClient();
            Console.WriteLine("Attempting to connect to host.docker.internal:10002...");
            await client2.ConnectAsync("host.docker.internal", 10002).WaitAsync(TimeSpan.FromSeconds(2));
            Console.WriteLine("Connected to host.docker.internal:10002!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to connect to host.docker.internal:10002: {ex.Message}");
        }
    }
}
