using Aspire.Hosting;
class Test { void M() { var b = DistributedApplication.CreateBuilder(); b.AddDockerfile("test", "."); } }
