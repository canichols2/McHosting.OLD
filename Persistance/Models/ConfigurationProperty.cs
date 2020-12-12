using System.ComponentModel.DataAnnotations;

namespace Persistence.Models
{
    public class ConfigurationProperty
    {
        [Key]
        public int Id { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
    }
}