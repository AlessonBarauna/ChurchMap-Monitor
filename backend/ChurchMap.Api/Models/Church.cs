namespace ChurchMap.Api.Models;

/// <summary>Igreja mapeada via OpenStreetMap.</summary>
public class Church
{
    public long OsmId { get; set; }
    public string Name { get; set; } = "";
    public double Lat { get; set; }
    public double Lon { get; set; }
    public string? Denomination { get; set; }
    public string? Street { get; set; }
    public string? HouseNumber { get; set; }
    public string? Suburb { get; set; }
    public string? City { get; set; }
    public string? RawTagsJson { get; set; }
}
